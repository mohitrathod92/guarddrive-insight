import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const guarddriveApi = createApi({
  reducerPath: 'guarddriveApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:4000/api/' }),
  tagTypes: ['Drivers', 'Incidents', 'Fleet', 'Analytics'],
  endpoints: (builder) => ({
    // Analytics
    getAnalytics: builder.query<any, void>({
      query: () => 'analytics',
      providesTags: ['Analytics', 'Drivers', 'Incidents'],
    }),
    
    // Drivers
    getDrivers: builder.query<any[], void>({
      query: () => 'drivers',
      providesTags: ['Drivers'],
    }),
    getDriverById: builder.query<any, string>({
      query: (id) => `drivers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Drivers', id }],
    }),
    
    // Incidents
    getIncidents: builder.query<any[], void>({
      query: () => 'incidents',
      providesTags: ['Incidents'],
    }),
    createIncident: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: 'incidents',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Incidents', 'Drivers', 'Analytics'],
    }),

    // Fleet
    getFleetVehicles: builder.query<any[], void>({
      query: () => 'fleet',
      providesTags: ['Fleet'],
    }),
  }),
});

export const {
  useGetAnalyticsQuery,
  useGetDriversQuery,
  useGetDriverByIdQuery,
  useGetIncidentsQuery,
  useCreateIncidentMutation,
  useGetFleetVehiclesQuery,
} = guarddriveApi;
