import { db } from "@/lib/db";

export const getOrCreateConversations = async (
  memberOneId: string,
  membertwoId: string
) => {
  let conversation =
    (await findConversations(memberOneId, membertwoId)) ||
    (await findConversations(membertwoId, memberOneId));

  if (!conversation) {
    conversation = await createNewConversations(memberOneId, membertwoId);
  }

  return conversation;
};

export const findConversations = async (
  memberOneId: string,
  membertwoId: string
) => {
  try {
    return await db.conversation.findFirst({
      where: {
        AND: [
          {
            memberOneId: memberOneId,
          },
          {
            memberTwoId: membertwoId,
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
  } catch (error) {
    return null;
  }
};

export const createNewConversations = async (
  memberOneId: string,
  memberTwoId: string
) => {
  try {
    return await db.conversation.create({
      data: {
        memberOneId,
        memberTwoId,
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
  } catch (error) {
    return null;
  }
};
