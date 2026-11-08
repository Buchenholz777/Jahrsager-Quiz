import { requireAdminPage } from "@/server/admin-session";
import { EventForm } from "../event-form";

export const metadata = { title: "Neues Ereignis" };

export default async function NewEvent() {
  await requireAdminPage();
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Neues Ereignis</h1>
      <EventForm event={null} />
    </div>
  );
}
