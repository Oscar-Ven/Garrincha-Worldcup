import ProfileClient from "@/components/player/ProfileClient";
import { requirePlayerContext } from "@/lib/player-app";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await requirePlayerContext();

  const fields = [
    { label: "Full name", value: user.fullName },
    { label: "Nickname", value: user.nickname },
    { label: "Email", value: user.email },
    { label: "Activation center", value: user.center.name },
    { label: "Competition center", value: user.competitionCenter?.name ?? "Not selected" },
    { label: "Nationality", value: user.nationality ?? "Not provided" },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
        <h1 className="text-[clamp(1.35rem,4vw,2rem)] font-semibold tracking-tight text-white">Profile</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300">Profile details are currently read-only except for the avatar. No backend endpoint exists yet for editing name, email, or phone.</p>
      </section>

      <ProfileClient avatarUrl={user.avatarUrl} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <div key={field.label} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{field.label}</div>
            <div className="mt-2 break-words text-sm font-medium text-white">{field.value}</div>
          </div>
        ))}
      </section>
    </div>
  );
}