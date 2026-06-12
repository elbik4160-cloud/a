import { getAllUsers } from "@/app/actions/users"
import { UsersView } from "@/components/users-view"

export default async function UsersPage() {
  const users = await getAllUsers()
  return <UsersView initialUsers={users} />
}
