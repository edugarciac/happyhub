// Rutas pensadas para incrustarse en el panel de la tablet de la sala (Home Assistant):
// se muestran sin cabecera, pie, widget de feedback ni banner de cookies.
export const KIOSK_PATHS = ['/guia-sala/panel'];

export function isKioskPath(pathname: string): boolean {
  return KIOSK_PATHS.includes(pathname);
}
