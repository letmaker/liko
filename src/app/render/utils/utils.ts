export function fastCopy(oldBuffer: ArrayBuffer, newBuffer: ArrayBuffer) {
  const lengthDouble = (oldBuffer.byteLength / 8) | 0;

  const sourceFloat64View = new Float64Array(oldBuffer, 0, lengthDouble);
  const destinationFloat64View = new Float64Array(newBuffer, 0, lengthDouble);

  // Use set for faster copying
  destinationFloat64View.set(sourceFloat64View);

  // copying over the remaining bytes
  const remainingBytes = oldBuffer.byteLength - lengthDouble * 8;

  if (remainingBytes > 0) {
    const sourceUint8View = new Uint8Array(oldBuffer, lengthDouble * 8, remainingBytes);
    const destinationUint8View = new Uint8Array(newBuffer, lengthDouble * 8, remainingBytes);

    // Direct copy for remaining bytes
    destinationUint8View.set(sourceUint8View);
  }
  return newBuffer;
}
