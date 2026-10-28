import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentSeasonId, seasonAdminDb } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth";
import { registrationIsOpen } from "@/lib/league-validation";
import { LeagueActionForm } from "@/components/LeagueActionForm";
import { submitLeagueRegistration } from "../actions";
import { formatDateShort } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Inscribí tu equipo" };

export default async function RegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [season, auth, currentId] = await Promise.all([
    seasonAdminDb.season.findUnique({ where: { slug }, select: { id: true, name: true, slug: true, status: true, registrationOpen: true, registrationDeadline: true } }),
    requireActiveUser(), getCurrentSeasonId(),
  ]);
  if (!season) notFound();
  const preview = auth?.user.role.key === "SUPERADMIN" && season.id === currentId;
  const user = auth?.user.role.key === "DELEGADO" ? auth.user : undefined;
  const request = user ? await seasonAdminDb.leagueRegistration.findFirst({ where: { seasonId: season.id, userId: user.id }, select: { status: true, teamName: true, reviewNote: true } }) : null;
  const hasTeam = user?.teamId ? Boolean(await seasonAdminDb.team.findFirst({ where: { id: user.teamId, seasonId: season.id }, select: { id: true } })) : false;
  const open = season.id === currentId && registrationIsOpen(season);
  return <div className="container-page py-10 sm:py-16">
    <header className="registration-hero"><p className="arena-overline">{season.name}</p><h1>Tu equipo.<br /><em>La próxima liga.</em></h1><p>Inscribí tu equipo y su delegado. La organización revisará la solicitud antes de habilitar la participación.</p></header>
    <div className="registration-layout">
      <aside className="registration-steps"><h2>Cómo participar</h2><ol><li><b>01</b><div><strong>Inscribí tu equipo</strong><p>Completá sus datos y los del delegado responsable.</p></div></li><li><b>02</b><div><strong>Esperá la aprobación</strong><p>La organización revisa cada solicitud.</p></div></li><li><b>03</b><div><strong>Prepará tu plantel</strong><p>Una vez aprobado, el delegado administra su equipo desde el panel.</p></div></li></ol>{season.registrationDeadline && <p className="mt-6 text-sm">Inscripción hasta el {formatDateShort(season.registrationDeadline)}, hora de Paraguay.</p>}<Link href="/historico" className="mt-5 inline-block text-sm underline">Ver ligas anteriores ↗</Link></aside>
      <section className="card p-5 sm:p-8">
        {request ? <div role="status"><p className="arena-overline">{request.status}</p><h2 className="mt-3 text-2xl font-extrabold">{request.teamName}</h2><p className="mt-3 text-sm text-[var(--color-gray-500)]">{request.status === "PENDIENTE" ? "Recibimos la inscripción. Está pendiente de revisión por la organización." : request.status === "APROBADA" ? "Tu equipo fue aprobado. Ya podés ingresar al panel para preparar el plantel." : "La solicitud no fue aprobada. Podés consultar con la organización."}</p>{request.reviewNote && <p className="league-warning mt-4">{request.reviewNote}</p>}{request.status === "APROBADA" && <Link className="btn btn-primary mt-5" href="/admin/mi-equipo">Administrar mi equipo ↗</Link>}</div>
        : hasTeam ? <div><h2 className="section-title">Tu equipo ya está inscrito</h2><Link className="btn btn-primary mt-5" href="/admin/mi-equipo">Administrar mi equipo ↗</Link></div>
        : !open && !preview ? <div><p className="arena-overline">Inscripciones cerradas</p><h2 className="mt-3 text-2xl font-extrabold">Esta liga no recibe solicitudes.</h2><p className="mt-3 text-sm text-[var(--color-gray-500)]">Consultá el estado de la competición o volvé cuando se abra una nueva edición.</p><Link className="btn btn-outline mt-5" href="/">Volver a la liga</Link></div>
        : auth && auth.user.role.key !== "DELEGADO" && !preview ? <p className="text-sm">La inscripción está destinada a delegados. Ingresá con una cuenta de delegado para inscribir tu equipo.</p>
        : <>{preview && <div role="status" className="league-success mb-6"><strong>Vista previa para superadmin</strong><p>Podés revisar y probar los campos. El envío está deshabilitado en esta vista. Las inscripciones públicas están {open ? "abiertas" : "cerradas"}.</p><Link href="/admin/ligas" className="mt-2 inline-block font-bold underline">Volver al control de ligas ↗</Link></div>}<h2 className="text-xl font-extrabold">Inscripción de equipo</h2>{user ? <p className="mt-2 mb-6 text-sm text-[var(--color-gray-500)]">La solicitud quedará vinculada a {user.firstName} {user.lastName} ({user.username}). Conservás tu cuenta actual.</p> : preview ? <p className="mt-2 mb-6 text-sm text-[var(--color-gray-500)]">Así se presenta el formulario a un delegado que solicita su cuenta por primera vez.</p> : <p className="mt-2 mb-6 text-sm text-[var(--color-gray-500)]">¿Ya sos delegado? <Link className="font-bold underline" href="/admin/login">Ingresá con tu cuenta</Link> antes de inscribir al equipo.</p>}
          <LeagueActionForm action={submitLeagueRegistration} buttonLabel="Enviar solicitud de inscripción" preview={preview}>
            <input type="hidden" name="seasonId" value={season.id} />
            <div className="grid gap-4 sm:grid-cols-2"><label className="league-field sm:col-span-2">Nombre del equipo<input name="teamName" required minLength={2} maxLength={80} className="input" autoComplete="organization" /></label><label className="league-field">Abreviatura<input name="shortName" required minLength={2} maxLength={6} className="input" placeholder="Ej.: CFC" /></label><label className="league-field">Gamertag / ID de juego<input name="gamertag" required minLength={2} maxLength={80} className="input" /></label></div>
            {!user && <><h3 className="mt-4 font-bold">Cuenta del delegado</h3><div className="grid gap-4 sm:grid-cols-2"><label className="league-field">Nombre<input name="firstName" required maxLength={60} autoComplete="given-name" className="input" /></label><label className="league-field">Apellido<input name="lastName" required maxLength={60} autoComplete="family-name" className="input" /></label><label className="league-field sm:col-span-2">Correo<input name="email" type="email" required maxLength={160} autoComplete="email" className="input" /></label><label className="league-field sm:col-span-2">Usuario para el panel<input name="username" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]+" autoComplete="username" className="input" /></label><label className="league-field">Contraseña<input name="password" type="password" required minLength={10} maxLength={72} autoComplete="new-password" className="input" /></label><label className="league-field">Repetir contraseña<input name="confirmPassword" type="password" required minLength={10} maxLength={72} autoComplete="new-password" className="input" /></label></div></>}
            <label className="league-field">Teléfono de contacto<input name="phone" type="tel" required minLength={6} maxLength={30} autoComplete="tel" className="input" /></label>
            <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            <label className="league-checkbox"><input name="consent" type="checkbox" required />Acepto que la organización use estos datos para gestionar la inscripción y contactar al delegado.</label>
            <p className="text-xs text-[var(--color-gray-500)]">El envío no confirma la participación. La cuenta nueva se habilitará cuando la organización apruebe al equipo.</p>
          </LeagueActionForm>
        </>}
      </section>
    </div>
  </div>;
}
