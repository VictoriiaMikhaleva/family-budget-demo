// Демо-версия: синхронизация с облаком отключена, данные только в localStorage.

export function getCloudRevision(data) {
  return typeof data?.revision === "number" ? data.revision : 0;
}

export function listenBudgetFromCloud(callback) {
  callback({ exists: false, data: null, fromCache: true, hasPendingWrites: false });
  return () => {};
}

export async function saveBudgetToCloud() {
  return Promise.resolve();
}
