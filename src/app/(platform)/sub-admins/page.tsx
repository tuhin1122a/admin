import { db } from "@/lib/db";
import { AdminTable } from "./data-table";
import { columns } from "./columns";

async function getAdmins() {
  const data = await db.admin.findMany();
  return data;
}

export default async function SubAdminsPage() {
  const data = await getAdmins();

  return (
    <div className="container mx-auto py-10">
      <AdminTable columns={columns} data={data} />
    </div>
  );
}