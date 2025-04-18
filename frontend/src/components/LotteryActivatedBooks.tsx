
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { TabNavigation } from "@/components";
import { 
  Dialog,
  DialogTrigger 
} from "@/components/ui/dialog";
import LotteryGameDialog from "@/components/dialogs/LotteryGameDialog";
import InventoryDialog from "@/components/dialogs/InventoryDialog";

interface LotteryActivatedBooksProps {
  data?: any[];
}

const LotteryActivatedBooks: React.FC<LotteryActivatedBooksProps> = ({ data = [] }) => {
  const [activeSection, setActiveSection] = useState<string>("activated");
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  
  const tabs = [
    { id: "activated", label: "Activated Books" },
    { id: "returned", label: "Returned Books" }
  ];

  return (
    <div className="bg-white rounded-md shadow mt-4">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Lottery Activated Books</h2>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => setIsGameDialogOpen(true)}
            >
              Manage Games
            </Button>
            <Button 
              variant="default" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsInventoryDialogOpen(true)}
            >
              Manage Inventory
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-md p-3">
            <h3 className="font-medium mb-2">Scan Code and Activate</h3>
            <div className="flex mb-2">
              <input 
                type="text" 
                placeholder="Scan Book Number" 
                className="border rounded-l-md px-3 py-2 flex-1"
              />
              <Button variant="ghost" className="rounded-l-none border border-l-0">
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="border rounded-md p-3">
            <h3 className="font-medium mb-2">Activate Manually</h3>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Game Number (XXX)" 
                className="border rounded-md px-3 py-2 w-full"
              />
              <input 
                type="text" 
                placeholder="Book Number (XXXXXXX)" 
                className="border rounded-md px-3 py-2 w-full"
              />
              <input 
                type="text" 
                placeholder="Reference Number (X)" 
                className="border rounded-md px-3 py-2 w-full"
              />
            </div>
            <Button variant="default" className="w-full mt-2 bg-green-600 hover:bg-green-700">
              Activate
            </Button>
          </div>

          <div className="border rounded-md p-3">
            <h3 className="font-medium mb-2">Return Book</h3>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Game Number" 
                className="border rounded-md px-3 py-2 w-full"
              />
              <input 
                type="text" 
                placeholder="Book Number" 
                className="border rounded-md px-3 py-2 w-full"
              />
              <input 
                type="text" 
                placeholder="Ticket Number" 
                className="border rounded-md px-3 py-2 w-full"
              />
            </div>
            <Button variant="default" className="w-full mt-2 bg-blue-500 hover:bg-blue-600">
              Return Now
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t">
        <TabNavigation 
          tabs={tabs} 
          activeTab={activeSection} 
          onChange={setActiveSection} 
        />

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">No</th>
                  <th className="pb-2">Game Name</th>
                  <th className="pb-2">Game Number</th>
                  <th className="pb-2">Book Number</th>
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialogs for Lottery management */}
      <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
        <LotteryGameDialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen} />
      </Dialog>
      
      <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
        <InventoryDialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen} />
      </Dialog>
    </div>
  );
};

export default LotteryActivatedBooks;
