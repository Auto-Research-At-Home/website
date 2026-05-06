import type { ComponentPropsWithoutRef } from "react";
import { explorerAddressUrl, shortAddress } from "@/lib/arah/format";

type AddressLinkProps = {
  address: string;
  display?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"a">, "href" | "children">;

/**
 * Renders an EVM address (or any value the registry treats as an address)
 * as a link to the 0G Galileo explorer with a hover underline affordance.
 */
export function AddressLink({
  address,
  display,
  className,
  title,
  ...rest
}: AddressLinkProps) {
  return (
    <a
      {...rest}
      href={explorerAddressUrl(address)}
      target="_blank"
      rel="noreferrer noopener"
      title={title ?? `View ${address} on 0G Galileo Chainscan`}
      className={
        "relative z-20 cursor-pointer underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline pointer-events-auto" +
        (className ? ` ${className}` : "")
      }
    >
      {display ?? shortAddress(address)}
    </a>
  );
}
