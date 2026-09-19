import { getCountryCode } from "@yahatapp/coffee-reference";
import { Globe } from "lucide-react";

type OriginFlagProps = {
  origin: string | null | undefined;
  size?: number;
};

const toFlagEmoji = (countryCode: string) =>
  String.fromCodePoint(
    countryCode.toUpperCase().charCodeAt(0) + 127397,
    countryCode.toUpperCase().charCodeAt(1) + 127397,
  );

export const OriginFlag = ({ origin, size = 24 }: OriginFlagProps) => {
  const countryCode = getCountryCode(origin);

  return (
    <span
      className="flex shrink-0 items-center justify-center leading-none text-cafe-primary"
      style={{ width: size, height: size, fontSize: size }}
      role="img"
      aria-label={countryCode ? `${origin}の国旗` : origin ? `${origin}（国旗なし）` : "産地未登録"}
    >
      {countryCode ? toFlagEmoji(countryCode) : <Globe aria-hidden="true" size={size} />}
    </span>
  );
};
