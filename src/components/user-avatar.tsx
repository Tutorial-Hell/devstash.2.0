import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarProps {
  name?: string | null
  image?: string | null
  size?: "default" | "sm" | "lg"
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function UserAvatar({ name, image, size = "default" }: UserAvatarProps) {
  return (
    <Avatar size={size}>
      {image && <AvatarImage src={image} alt={name ?? "User"} />}
      <AvatarFallback>{name ? getInitials(name) : "?"}</AvatarFallback>
    </Avatar>
  )
}
