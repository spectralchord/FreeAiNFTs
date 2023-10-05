import {useNavigate} from "react-router-dom";
import {Button} from "@/components/primitives/Button";
import {Alert, AlertTitle} from "@/components/primitives/Alert";

export const PageNotFound = () => {
    const navigate = useNavigate()
    return (
        <Alert variant={'destructive'}>
            <AlertTitle>404. Not found route!</AlertTitle>
            <Button variant={'destructive'} onClick={() => navigate('/')}>
                Home
            </Button>
        </Alert>
    );
};