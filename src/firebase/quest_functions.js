import { auth } from "./firebase";

/*  Journey Quests
    Equivalent to treasure hunt quests, but i thought this name was cooler.
    ---------------------------------------------------------------------------
    Quest attempter is given pictures of locations, with an accompanying riddle for each one forming the quest chain
    instead of using scannables that could end up as litter, we could just store the geolocation data of each location,(api integration) 
    then our user can verify that they've reached the locations by a tap of a button, so they can immediately continue the quest without
    waiting for admin approval of their progress. No search radius given except for the final location in the chain
    

*/ 

export async function InitializeJourneyQuest() {

    
}
export async function AddJourneyQuestLocation(params) {
    
}
export async function PublishJourneyQuest(params) {
    
}

/*
export async function FetchActiveQuests() {
    const user = auth.currentUser;
    if(!user){
        throw new Error("Student not verified")
    }
    const Quest
    
}*/

/*  Location Quests
    Made by other users, they upload a picture with some quest title/riddle. In this case the quest is completed by going to the physical location
    and taking an picture. We could potentially make these pictures collectibles, that users can keep on their profile page like old explorers, who
    kept and framed pictures of locations they went to. 

*/