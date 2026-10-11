export async function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const responseBody = await response.text()
    console.error('API returned a non-JSON response.', {
      status: response.status,
      body: responseBody.slice(0, 200),
    })
    throw new Error(
      'The server returned an unexpected response. Make sure the Vercel API is deployed and its database is configured.',
    )
  }

  return response.json()
}
