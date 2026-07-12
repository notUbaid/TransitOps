import { cn } from "@/lib/utils";

interface IconProps {
  name: string;
  className?: string;
  /** Filled variant of the Material Symbol. */
  fill?: boolean;
  /** Pixel size; also drives optical sizing. */
  size?: number;
}

export function Icon({ name, className, fill, size = 20 }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined", fill && "icon-fill", className)}
      style={{ fontSize: size, width: size, height: size }}
    >
      {name}
    </span>
  );
}
