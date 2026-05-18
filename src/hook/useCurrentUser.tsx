"use client";

import { useSession } from "next-auth/react";

const useCurrentUser = () => {
  const sesstion = useSession();

  return sesstion.data?.user;
};

export default useCurrentUser;
