import React from 'react';
import SubscriptionItem from "@/pages/SubscriptionItem";
import {SubscriptionContractAddress} from "@/share/ethersConfig";

const SubscriptionList = () => {
    return (
        <div className={'flex flex-col gap-2'}>
            {SubscriptionContractAddress?.map((item, index) =>
                <SubscriptionItem subscriptionContract={item} index={index}/>
            )}
        </div>
    );
};

export default SubscriptionList;