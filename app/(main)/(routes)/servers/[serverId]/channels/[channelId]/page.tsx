import React from "react";
import { currentProfile } from "@/lib/current-profile";
import { redirectToSignIn } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ChatHeader from "@/components/chat/Chat-Header";
import ChatInput from "@/components/chat/Chat-Input";
import ChatMessages from "@/components/chat/Chat-Messages";
import { ChannelType } from "@prisma/client";
import MediaRoom from "@/components/Media-Room";

interface ChannelPageProps {
  params: {
    serverId: string;
    channelId: string;
  };
}

const ChannelPage = async ({ params }: ChannelPageProps) => {
  const profile = await currentProfile();

  if (!profile) {
    return redirectToSignIn();
  }

  const channel = await db.channel.findUnique({
    where: {
      id: params?.channelId,
    },
  });

  const members = await db.member.findFirst({
    where: {
      serverId: params?.serverId,
      profileId: profile?.id,
    },
  });

  if (!channel || !members) {
    return redirect("/");
  }

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        serverId={params.serverId}
        type="channel"
        name={channel.name}
      />
      {channel.type === ChannelType.TEXT && (
        <>
          <ChatMessages
            member={members}
            name={channel.name}
            chatId={channel.id}
            type="channel"
            apiUrl="/api/messages"
            sockertUrl="/api/socket/messages"
            socketQuery={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
            paramKey="channelId"
            paramValue={channel.id}
          />
          <ChatInput
            name={channel.name}
            type="channel"
            apiUrl="/api/socket/messages"
            query={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
          />
        </>
      )}
      {channel.type === ChannelType.AUDIO && (
        <>
          <MediaRoom chatId={channel.id} audio={true} video={false} />
        </>
      )}
      {channel.type === ChannelType.VIDEO && (
        <>
          <MediaRoom chatId={channel.id} audio={false} video={true} />
        </>
      )}
    </div>
  );
};

export default ChannelPage;
