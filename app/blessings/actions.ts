"use server";

import { refresh } from "next/cache";
import { deleteEntry, isAdminKey } from "@/lib/guestbook";

/** Only someone holding the couple's private key can delete a message. */
export async function removeBlessing(key: string, id: string) {
  if (!isAdminKey(key)) throw new Error("Not allowed");
  await deleteEntry(id);
  refresh();
}
