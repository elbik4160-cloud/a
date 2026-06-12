import { getPermissionsMatrix } from "@/app/actions/permissions"
import { PermissionsView } from "@/components/permissions-view"

export default async function PermissionsPage() {
  const matrix = await getPermissionsMatrix()
  return (
    <div className="p-4 md:p-6">
      <PermissionsView matrix={matrix} />
    </div>
  )
}
