export const registerUser = async function (forwarder: any, request: any, signature: any) {
    const valid = await forwarder.verify(request, signature);
    if (!valid) throw new Error('Invalid request');
    return await forwarder?.execute(request, signature, {
        gasLimit: (parseInt(request.gas) + 50000).toString()
    });
}