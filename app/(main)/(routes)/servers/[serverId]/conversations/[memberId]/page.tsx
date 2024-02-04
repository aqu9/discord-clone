import MediaRoom from "@/components/Media-Room";
import ChatHeader from "@/components/chat/Chat-Header";
import ChatInput from "@/components/chat/Chat-Input";
import ChatMessages from "@/components/chat/Chat-Messages";
import { getOrCreateConversations } from "@/lib/conversations";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirectToSignIn } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

interface conversationProps {
  params: {
    serverId: string;
    memberId: string;
  };
  searchParams: { video?: boolean };
}

const ConversationPage = async ({
  params,
  searchParams,
}: conversationProps) => {
  const profile = await currentProfile();
  if (!profile) {
    return redirectToSignIn();
  }

  const currentMember = await db.member.findFirst({
    where: {
      serverId: params.serverId,
      profileId: profile.id,
    },
    include: {
      profile: true,
    },
  });

  if (!currentMember) {
    return redirect("/");
  }

  const conversation = await getOrCreateConversations(
    currentMember.id,
    params.memberId
  );

  if (!conversation) {
    return redirect(`/servers/${params.serverId}`);
  }

  console.log(conversation.id);

  const { memberOne, memberTwo } = conversation;
  const otherMember =
    memberOne.profileId === profile.id ? memberTwo : memberOne;
  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        serverId={params.serverId}
        type="conversation"
        name={otherMember.profile.name}
        imageUrl={otherMember.profile.imageUrl}
      />
      {!searchParams?.video && (
        <>
          <ChatMessages
            member={currentMember}
            name={otherMember?.profile?.name}
            chatId={conversation.id}
            type="conversation"
            apiUrl="/api/direct-messages"
            paramKey="conversationId"
            paramValue={conversation.id}
            sockertUrl="/api/socket/direct-messages"
            socketQuery={{
              conversationId: conversation.id,
            }}
          />
          <ChatInput
            name={otherMember.profile.name}
            type="conversation"
            apiUrl="/api/socket/direct-messages"
            query={{
              conversationId: conversation.id,
            }}
          />
        </>
      )}

      {searchParams?.video && (
        <>
          <MediaRoom chatId={conversation.id} audio={true} video={true} />
        </>
      )}
    </div>
  );
};

export default ConversationPage;
