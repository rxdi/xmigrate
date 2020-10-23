export const formatDate = (date: Date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const hours = '' + d.getUTCHours();
  const minutes = '' + d.getUTCMinutes();
  const seconds = '' + d.getUTCSeconds();
  const convertedSeconds =
    Number(seconds) < 10 ? [0, seconds].join('') : seconds;
  if (month.length < 2) {
    month = '0' + month;
  }
  if (day.length < 2) {
    day = '0' + day;
  }
  return [year, month, day, hours, minutes, convertedSeconds].join('');
};

export const nowAsString = () => formatDate(new Date());
