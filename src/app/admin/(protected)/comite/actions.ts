'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/permissions';
import { mutateCommittee } from '@/lib/committee';
export async function committeeAction(form: FormData) {
  await requireAuth();
  let id = '';
  try { id = await mutateCommittee(form); }
  catch (error) {
    const message = error instanceof Error && !('code' in error) ? error.message : 'No se pudo guardar. Actualizá y volvé a intentar.';
    redirect('/admin/comite?error=' + encodeURIComponent(message));
  }
  revalidatePath('/admin/comite');
  redirect('/admin/comite' + (id ? '?id=' + encodeURIComponent(id) : ''));
}
