import React from 'react';
import AppWrapper from "@/components/AppWrapper";
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import {PageNotFound} from "@/pages/PageNotFound";
import DetailsPage from "@/pages/DetailsPage";
import SubscriptionList from "@/pages/SubscriptionList";

export const router = createBrowserRouter([
    {
        path: '',
        element: <AppWrapper/>,
        children: [
            {
                path: '/',
                element: <SubscriptionList/>,
            },
            {
                path: '/:id',
                element: <DetailsPage/>,
            },
            {
                path: '*',
                element: <PageNotFound/>,
            },
        ],
    },
]);

const AppRoutes = () => {
    return (
        <RouterProvider router={router}/>
    );
};

export default AppRoutes;