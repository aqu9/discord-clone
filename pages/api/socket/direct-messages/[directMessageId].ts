import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { NextApiResponseServerIo } from "@/types";
import { MemberRole } from "@prisma/client";
import { NextApiRequest } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  const allowdMethods = ["PATCH", "DELETE"];
  if (!allowdMethods.includes(req?.method || "")) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfilePages(req);
    const { content } = req.body;
    const { directMessageId, conversationId } = req.query;

    if (!profile) {
      return res.status(401).json({ error: "UnAUthorized" });
    }
    if (!conversationId) {
      return res.status(400).json({ error: "conversationId Missing" });
    }
    // if (!content) {
    //   return res.status(400).json({ error: "content Missing" });
    // }

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          {
            memberOne: {
              profileId: profile.id,
            },
          },
          {
            memberTwo: {
              profileId: profile.id,
            },
          },
        ],
      },
      include: {
        memberOne: {
          include: {
            profile: true,
          },
        },
        memberTwo: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "conversation not found " });
    }

    const member =
      conversation.memberOne.profileId === profile.id
        ? conversation.memberOne
        : conversation.memberTwo;

    if (!member) {
      return res.status(404).json({ error: "member not found " });
    }

    let mess = await db.directMessage.findFirst({
      where: {
        id: directMessageId as string,
        conversationId: conversationId as string,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!mess || mess.deleted) {
      return res.status(404).json({ error: "message not found " });
    }

    const isMessageOwner = mess.memberId === member.id;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;

    const canModify = isMessageOwner || isAdmin || isModerator;

    if (!canModify) {
      return res.status(401).json({ error: "UnAUthorized" });
    }

    if (req.method === "DELETE") {
      mess = await db.directMessage.update({
        where: {
          id: directMessageId as string,
        },
        data: {
          fileUrl: null,
          content: "This message has been deleted",
          deleted: true,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
      });
    }
    if (req.method === "PATCH") {
      if (!isMessageOwner) {
        return res.status(401).json({ error: "UnAUthorized" });
      }
      mess = await db.directMessage.update({
        where: {
          id: directMessageId as string,
        },
        data: {
          content: content,
        },
        include: {
          member: {
            include: {
              profile: true,
            },
          },
        },
      });
    }

    const updatekey = `chat:${conversation.id}:messages:update`;
    res?.socket?.server?.io?.emit(updatekey, mess);

    return res.status(200).json(mess);
  } catch (error) {
    console.log("MESSAGES_POST", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
