import { cn } from "../../lib/utils"

export const GridIcon = ({ className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-4 h-4", className)}
      {...props}
    >
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.5" />
      <rect x="9.75" y="2.5" width="4.5" height="4.5" rx="0.5" />
      <rect x="17" y="2.5" width="4.5" height="4.5" rx="0.5" />
      <rect x="2.5" y="9.75" width="4.5" height="4.5" rx="0.5" />
      <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="0.5" />
      <rect x="17" y="9.75" width="4.5" height="4.5" rx="0.5" />
      <rect x="2.5" y="17" width="4.5" height="4.5" rx="0.5" />
      <rect x="9.75" y="17" width="4.5" height="4.5" rx="0.5" />
      <rect x="17" y="17" width="4.5" height="4.5" rx="0.5" />
    </svg>
  )
}
