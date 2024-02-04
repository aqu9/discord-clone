"use client";

import { useEffect, useState } from "react";
import CreateServerModal from "@/components/modals/CreateServer-Modal";
import InviteModal from "@/components/modals/Invite-Modal";
import EditServerModal from "@/components/modals/EditServer-Modal";
import MembersModal from "@/components/modals/Members-Modal";
import CreateChannel from "@/components/modals/CreateChannel-Modal";
import LeaveServerModal from "@/components/modals/LeaveServer-Modal";
import DeleteServerModal from "@/components/modals/DeleteServer-Modal";
import DeleteChannelModal from "@/components/modals/DeleteChannel-Modal";
import EditChannelModal from "@/components/modals/EditChannel-Modal";
import MessageFileModal from "@/components/modals/MessageFile-Modal";
import DeleteMessageModal from "@/components/modals/DeleteMessage-Modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <CreateServerModal />
      <InviteModal />
      <EditServerModal />
      <MembersModal />
      <CreateChannel />
      <LeaveServerModal />
      <DeleteServerModal />
      <DeleteChannelModal />
      <EditChannelModal />
      <MessageFileModal />
      <DeleteMessageModal />
    </>
  );
};
