import React from "react";
import Details from "./details";
type Params = Promise<{ id: string }>;
const UserDetails = async ({ params }: { params: Params }) => {
  const { id } = await params;
  return (
    <div>
      <Details userId={id} />
    </div>
  );
};

export default UserDetails;
