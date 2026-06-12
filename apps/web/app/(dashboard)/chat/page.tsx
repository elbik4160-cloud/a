import { getChatMessages } from "@/app/actions/chat"
import { ChatView } from "@/components/chat-view"
import { getCurrentUser } from "@crm/auth/session"
import { redirect } from "next/navigation"

export default async function ChatPage() {
  const me = await getCurrentUser()
  if (!me) redirect("/sign-in")
  if (me.status !== "approved") redirect("/pending")

  const messages = (await getChatMessages()) as any[]

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold">المجموعة / Group Chat</h1>
        <p className="text-sm text-muted-foreground">تواصل مع الفريق / Communicate with the team</p>
      </div>
      <ChatView meId={me.id} isAdmin={me.role === "admin"} initialMessages={messages} />
    </div>
  )
}
