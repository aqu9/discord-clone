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
    const { serverId, channelId, messageId } = req.query;

    console.log(serverId, channelId, "inside server");

    if (!profile) {
      return res.status(401).json({ error: "UnAUthorized" });
    }
    if (!serverId) {
      return res.status(400).json({ error: "ServerId Missing" });
    }
    if (!channelId) {
      return res.status(400).json({ error: "channelId Missing" });
    }
    // if (!content) {
    //   return res.status(400).json({ error: "content Missing" });
    // }

    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!server) {
      return res.status(404).json({ error: "server not found " });
    }

    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string,
      },
    });

    if (!channel) {
      return res.status(404).json({ error: "channel not found " });
    }

    const member = server.members.find(
      (member) => member.profileId === profile.id
    );

    if (!member) {
      return res.status(404).json({ error: "member not found " });
    }

    let mess = await db.message.findFirst({
      where: {
        id: messageId as string,
        channelId: channelId as string,
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
      mess = await db.message.update({
        where: {
          id: messageId as string,
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
      mess = await db.message.update({
        where: {
          id: messageId as string,
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

    const updatekey = `chat:${channelId}:messages:update`;
    res?.socket?.server?.io?.emit(updatekey, mess);

    return res.status(200).json(mess);
  } catch (error) {
    console.log("MESSAGES_POST", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
