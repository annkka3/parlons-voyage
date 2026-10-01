'use strict';
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
window.__onWriteError = code => { Cloud.fail({ code }); if (code === 'permission-denied') toast(tt('Not saved: the database refused access.', 'Не сохранилось: база отклонила доступ.')); };
render();
