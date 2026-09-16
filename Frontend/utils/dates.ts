export const formatDate = (timestamp: number) =>
  new Date(Number(timestamp)).toLocaleDateString();

export const formatShortDate = (timestamp: number) =>
  new Date(Number(timestamp)).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (timestamp: number) =>
  `${formatDate(timestamp)} · ${new Date(Number(timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;