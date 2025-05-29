import supabase from '@/lib/integrations/supabase'

const BASE_URL = 'https://api.ebb.cool'

export class ApiError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.message = message
    this.statusCode = statusCode
  }
}

export const getUrlParameters = (
  data: Record<string, string | number | boolean | undefined>,
) => {
  const ret = []
  for (const d in data) {
    const param = data[d]
    if (param !== undefined) {
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(param))
    }
  }
  return ret.join('&')
}


const requestFn = () => {
  const baseURL = BASE_URL

  const setHeaders = async (headers?: Record<string, string>) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (token) {
      headers = {
        ...headers,
        'Authorization': `Bearer ${token}`,
      }
    }
    return headers
  }

  return async ({
    url,
    method = 'GET',
    body,
    responseType = 'json',
    headers,
    credentials = 'same-origin',
  }: {
    url: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: object
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
    headers?: Record<string, string>
    credentials?: RequestCredentials
  }) => {
    headers = await setHeaders(headers)
    return fetch(`${baseURL}${url}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials,
      ...(body && { body: JSON.stringify(body || {}) }),
    })
      .then(async (response) => {
        if (!response.ok) {
          let responseObject
          const responseClone = response.clone()
          try {
            responseObject = await responseClone.json()
          } catch {
            responseObject = await response.text()
          }
          throw new ApiError(responseObject?.message, response.status)
        }
        switch (responseType) {
        case 'blob':
          return response.blob()
        case 'arraybuffer':
          return response.arrayBuffer()
        case 'text':
          return response.text()
        case 'json':
        default: {
          const res = await response.text()
          if (res) {
            try {
              const json = JSON.parse(res)
              return json.data
            } catch {
              return res
            }
          }
          return ''
        }
        }
      })
      .catch((err) => {
        console.error(err)
        throw err
      })
  }
}

export const platformApiRequest = requestFn()
