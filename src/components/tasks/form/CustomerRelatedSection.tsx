
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface CustomerRelatedSectionProps {
  isCustomerRelated: boolean;
  setIsCustomerRelated: (value: boolean) => void;
  customerName: string;
  setCustomerName: (value: string) => void;
}

export const CustomerRelatedSection: React.FC<CustomerRelatedSectionProps> = ({
  isCustomerRelated,
  setIsCustomerRelated,
  customerName,
  setCustomerName
}) => {
  return (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="isCustomerRelated" 
          checked={isCustomerRelated} 
          onCheckedChange={checked => setIsCustomerRelated(checked === true)} 
        />
        <label htmlFor="isCustomerRelated" className="text-sm">
          Customer Related Task
        </label>
      </div>

      {isCustomerRelated && (
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium mb-1">
            Customer Name <span className="text-destructive">*</span>
          </label>
          <Input 
            id="customerName" 
            value={customerName} 
            onChange={e => setCustomerName(e.target.value)} 
            required={isCustomerRelated} 
            placeholder="Enter customer name" 
            className="border border-input" 
          />
        </div>
      )}
    </>
  );
};
