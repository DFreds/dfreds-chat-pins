/**
 * Simple logger that prepends the package name if the data is a string
 *
 * @param {*} data - Data to log
 */
export default function (data) {
  if (typeof data === 'string') {
    console.log(`dfreds-chat-pins | ${data}`);
  } else {
    console.log(data);
  }
}
