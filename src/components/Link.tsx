import type { AnchorHTMLAttributes } from 'react'

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

/** Hash-router link */
export function Link({ to, ...rest }: LinkProps) {
  return <a href={`#${to}`} {...rest} />
}
