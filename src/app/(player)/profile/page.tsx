import ProfileClient from "@/components/player/ProfileClient";
import { requirePlayerContext } from "@/lib/player-app";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await requirePlayerContext();

  const readOnlyFields = [
    { label: "Activation center",   value: user.center?.name ?? "—" },
    { label: "Competition center",  value: user.competitionCenter?.name ?? "Not selected" },
    { label: "Email",               value: user.email },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/8 bg-white/3 p-5">
        <h1 className="text-[clamp(1.35rem,4vw,2rem)] font-semibold tracking-tight text-white">Profile</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Update your name, nickname, nationality and phone number. Your email and center assignments cannot be changed here.
        </p>
      </section>

      <ProfileClient
        avatarUrl={user.avatarUrl}
        fullName={user.fullName}
        nickname={user.nickname ?? ""}
        nationality={user.nationality ?? ""}
        phoneNumber={user.phoneNumber ?? ""}
        email={user.email}
      />

      <section className="grid gap-3 sm:grid-cols-3">
        {readOnlyFields.map((field) => (
          <div key={field.label} className="rounded-3xl border border-white/8 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{field.label}</div>
            <div className="mt-2 wrap-break-word text-sm font-medium text-white">{field.value}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
