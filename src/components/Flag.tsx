import { flagEmojiForIso, flagLabel, isoCodeForNationality, isoCodeForTeam } from "@/lib/flags";

export function CountryFlag({
  isoCode,
  label,
  size = "md",
}: {
  isoCode?: string | null;
  label?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const normalized = isoCode?.toLowerCase() ?? null;
  const emoji = flagEmojiForIso(isoCode);

  return (
    <span
      aria-label={flagLabel(label, normalized)}
      className={`emoji-flag ${size}`}
      role="img"
      title={normalized ? flagLabel(label, isoCode) : "Unknown flag"}
    >
      {normalized ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={`/flags/countries/${normalized}.svg`} />
      ) : (
        <span aria-hidden>{emoji ?? "◇"}</span>
      )}
    </span>
  );
}

export function TeamFlag({
  team,
  size = "md",
}: {
  team: { name?: string | null; fifaCode?: string | null; flagUrl?: string | null };
  size?: "sm" | "md" | "lg";
}) {
  return <CountryFlag isoCode={isoCodeForTeam(team)} label={team.name} size={size} />;
}

export function NationalityFlag({
  nationality,
  size = "sm",
}: {
  nationality?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  return <CountryFlag isoCode={isoCodeForNationality(nationality)} label={nationality} size={size} />;
}
