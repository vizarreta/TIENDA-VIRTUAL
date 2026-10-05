export const CATALOG_CHANGED = 'catalog-changed';

/** Notifica cambios de productos o stock sin importar componentes de otras pantallas. */
export function notifyCatalogChanged(): void {
  window.dispatchEvent(new Event(CATALOG_CHANGED));
}
