
{ 
	//Version 3.4.2 Current Leading Edge of dev

   //Refactor to give precedence to pick drop off floors
   //When idle and two people get on one going up and one going down I don't know where it is
   // going to go first and the elevator wrongly stops at that floor again. 
    init: function(elevators, floors) 
    {
        var minFloor = 0;
        var maxFloor = floors[floors.length - 1].floorNum();
        
        var buttonPressedBuffer = createArray(elevators.length, 0);

        //TODO consider adding an intermediate buffer that prevents value an elevator is traveling to be added to the master buffer.
        var masterUpBuffer = [];
        var masterDownBuffer = [];

        function createArray(length) 
        {
            var arr = new Array(length || 0),
                i = length;

             if (arguments.length > 1)
             {
                var args = Array.prototype.slice.call(arguments, 1);
                while(i--) arr[length-1 - i] = createArray.apply(this, args);
             }

            return arr;
        }

        function filterArray(array, removeValue)
        {
        	array = array.filter(function(element)
                        {
                            return element != removeValue;
                        });
        	return array;
        }

        function absDistance(floorNum, destinationFloorNum)
        {
            var distance = Math.abs(destinationFloorNum - floorNum);
            return distance;

        }
        //ToDo split best Destination Up or Down preference per even or odd elevators
        function getBestDestinationFromIdle(elevatorNum, floorNum)
        {
            var currentBestDestination = maxFloor + maxFloor + maxFloor;
            var currentBestDirection = "";
            var currentBestIndex = 0; 
            var precedenceMultiplier = maxFloor / 3;

            for (var i = 0; i < masterUpBuffer.length; i++)
            {
            	//TODO Consider what the order means and how it effects the efficiency of the solution.
                var calledToNum = masterUpBuffer[i];
                if (absDistance(floorNum, currentBestDestination) + (currentBestIndex * precedenceMultiplier) > absDistance(floorNum, calledToNum) + (i * precedenceMultiplier))
                {
                    currentBestDestination = calledToNum;
                    currentBestDirection = "up";
                    currentBestIndex = i;
                }
            }

            for (var i = 0; i < masterDownBuffer.length; i++)
            {
                var calledToNum = masterDownBuffer[i];            
                if (absDistance(floorNum, currentBestDestination) + (currentBestIndex * precedenceMultiplier) > absDistance(floorNum, calledToNum) + (i * precedenceMultiplier))
                {
                    currentBestDestination = calledToNum;
                    currentBestDirection = "down";
                    currentBestIndex = i; 
                }
            }
            if (currentBestDirection == "up")
            {
            	elevators[elevatorNum].goingDownIndicator(false);
                elevators[elevatorNum].goingUpIndicator(true);
                masterUpBuffer = filterArray(masterUpBuffer,currentBestDestination);

            }
            else if (currentBestDirection == "down")
            {
            	elevators[elevatorNum].goingDownIndicator(true);
                elevators[elevatorNum].goingUpIndicator(false);
                masterDownBuffer = filterArray(masterDownBuffer, currentBestDestination);

            }
            else
            {
                //TODO add magic master buffer grabber
            }
            return [currentBestDestination, currentBestDirection];
        }

        function getTheLightsRight(elevatorNum)
        {
            var elevator = elevators[elevatorNum];

            if(elevator.currentFloor() > elevator.destinationQueue[0])
            {
                elevator.goingDownIndicator(true);
                elevator.goingUpIndicator(false);
            }
            else if (elevator.currentFloor() < elevator.destinationQueue[0])
            {
                elevator.goingDownIndicator(false);
                elevator.goingUpIndicator(true);
            }
            else 
            {
            	elevator.goingDownIndicator(true);
            	elevator.goingUpIndicator(true);
            }



        //else if (elevator.destinationQueue.length > 1 )
        }

    	function sortButtonPressedBufferAndDestinationQueue(elevatorNum)
    	{
    		var elevator = elevators[elevatorNum];
    		if (buttonPressedBuffer[elevatorNum].length != 0 && elevator.destinationQueue.length != 0)
    			buttonPressedBuffer[elevatorNum].push(elevator.destinationQueue);
    		else if (elevator.destinationQueue.length != 0 && buttonPressedBuffer[elevatorNum].length == 0)
    			buttonPressedBuffer[elevatorNum] = elevator.destinationQueue;
    		else if (elevator.destinationQueue.length == 0 && buttonPressedBuffer[elevatorNum].length == 0)
    		    return;

    		if(elevator.currentFloor() > buttonPressedBuffer[elevatorNum][0])
            {
            	buttonPressedBuffer[elevatorNum].reverse(function(a, b){return a-b});

            }
            else 
            {
            	buttonPressedBuffer[elevatorNum].sort(function(a, b){return a-b});
            }

            elevator.destinationQueue = buttonPressedBuffer[elevatorNum];
            window.alert("Elevator: " + elevatorNum + " destinationQueue: " + elevator.destinationQueue)
            elevator.checkDestinationQueue();
            buttonPressedBuffer[elevatorNum] = [];
    	}

    	function optimizedPassengerLoadFactor(elevatorNum)
    	{
            switch(elevators[elevatorNum].maxPassengerCount())
            {
                case 4:
                    return 0.5;
                case 5:
                    return 0.55;
                case 6:
                    return 0.6;
                case 8:
                    return 0.62;
                case 10:
                    return 0.65;
            }
    	}







        //for (var i = 0; i < elevators.length; i++)
        elevators.forEach(function(elevator, ind)
        {         
            elevator.on("idle", function() 
            {
                window.alert("idle: " + ind)
                if(buttonPressedBuffer[ind].length != 0)
	                {

	                	sortButtonPressedBufferAndDestinationQueue(ind);
	                	getTheLightsRight(ind);
	                	//window.alert("elevator: " + ind + " queue: " + elevator.destinationQueue);
	                }
                else if ((masterUpBuffer.length != 0 || masterDownBuffer.length != 0))
                {
                    var bestDestinationFromIdleNum = getBestDestinationFromIdle(ind, elevator.currentFloor());
                    elevator.destinationQueue.push(bestDestinationFromIdleNum[0]);
                    elevator.checkDestinationQueue();
                    if (bestDestinationFromIdleNum[1] == "up")
                    {
                    	elevator.goingUpIndicator(true);
                    	elevator.goingDownIndicator(false);
                    }
                    else
                    {
                    	elevator.goingUpIndicator(false);
                    	elevator.goingDownIndicator(true);
                    }
                }
                else 
                {
                	elevator.goingUpIndicator(true);
                	elevator.goingDownIndicator(true);
                	if (ind == 1 || ind == 0)
                	{
                		elevator.goToFloor(0);
                	}
                    else
                        elevator.goToFloor(Math.ceil(maxFloor / ind));

                }
            });

            elevator.on("floor_button_pressed", function(floorNum)
            {
                window.alert("Elevator: " + ind + " FloorNum: " + floorNum );
                buttonPressedBuffer[ind].push(floorNum);

               	if (floorNum > elevator.currentFloor())
                {
               		filterArray(masterUpBuffer, floorNum);
                    filterArray(masterUpBuffer, elevator.currentFloor());
                }
               	else 
                {
               		filterArray(masterDownBuffer, floorNum);
                    filterArray(masterDownBuffer, elevator.currentFloor())
                }
            });

            elevator.on("passing_floor", function(floorNum, direction)
            {
            	window.alert("Elevator: " + ind + " Passing Floor: " + floorNum + " Going: " + direction); 
            	 // if(buttonPressedBuffer[ind].length != 0)
	             //    {
	             //    	sortButtonPressedBufferAndDestinationQueue(ind);
	             //    	window.alert("elevator: " + ind + " queue: " + elevator.destinationQueue)
	             //    }
                if((elevator.destinationQueue.indexOf(floorNum) != -1) || (buttonPressedBuffer[ind].indexOf(floorNum) != -1))
                {
                	//TODO This may be the cause of a data leak. Investigate and fix. 
                     elevator.goToFloor(floorNum, true);
                }
                //TODO Rewrite to consider elevator size as a factor
                else if(direction == "up" && elevator.loadFactor() < optimizedPassengerLoadFactor(ind) && masterUpBuffer.indexOf(floorNum) != -1)
                {
                   	elevator.goToFloor(floorNum, true);
                   	masterUpBuffer = filterArray(masterUpBuffer, floorNum);
                }
                //TODO Rewrite to consider elevator size as a factor.
                else if(direction == "down" && elevator.loadFactor() < optimizedPassengerLoadFactor(ind) && masterDownBuffer.indexOf(floorNum) != -1)
                {
                    elevator.goToFloor(floorNum, true);
                    masterDownBuffer = filterArray(masterDownBuffer, floorNum);
                }
                //else if (elevator.destinationQueue.length = 0 && arrayContains(masterDownBuffer, floorNum) || arrayContains(masterDownBuffer)))

            });

            //TODO Fix the hole due to order of operation. Nothing gets removed from the elevator buffer.
            elevator.on("stopped_at_floor", function(floorNum)
            {
 				window.alert("Elevator: " + ind + " stopped at floor: " + floorNum);
            	getTheLightsRight(ind);
            	//TODO Conisder what is the best if statement for this.
                elevator.destinationQueue = filterArray(elevator.destinationQueue, floorNum);
                elevator.checkDestinationQueue();
                buttonPressedBuffer[ind] = filterArray(buttonPressedBuffer[ind], floorNum);
                if (elevator.goingUpIndicator()) //&& elevator.destinationDirection() == "up")
                {
                	masterUpBuffer = filterArray(masterUpBuffer, floorNum);
                	if (elevator.loadFactor() < optimizedPassengerLoadFactor(ind) && masterUpBuffer.indexOf(floorNum - 1) != -1)
                	{
                		window.alert("3.1");
                		elevator.goToFloor(floorNum - 1, true);
                		filterArray(masterUpBuffer, floorNum - 1);
                	}
	                
                }
                //TODO Consider what is the best if statement for this.
                else if (elevator.goingDownIndicator()) //&& elevator.destinationDirection() == "down")
                {
                	masterDownBuffer = filterArray(masterDownBuffer, floorNum);
                	if (elevator.loadFactor() < optimizedPassengerLoadFactor(ind) && masterDownBuffer.indexOf(floorNum + 1) != -1)
                	{
                		window.alert("4.1");
                		elevator.goToFloor(floorNum + 1, true);
                		filterArray(masterDownBuffer, floorNum + 1)
                	}
                	else if(elevator.loadFactor() < optimizedPassengerLoadFactor(ind) && masterDownBuffer.indexOf(floorNum - 1) != -1)
	                {
	                	window.alert("4.2");
	                    elevator.goToFloor(floorNum - 1, true);
	                    masterDownBuffer = filterArray(masterDownBuffer, floorNum - 1);
	                }
                }

            });


        });
        floors.forEach(function(floor)
        {
            floor.on("up_button_pressed", function()
            {
            	window.alert("Floor: " + floor.floorNum() + " Direction: up");
                masterUpBuffer.push(floor.floorNum());
            });
            floor.on("down_button_pressed", function()
            {
            	window.alert("Floor: " + floor.floorNum() + " Direction: down");
                masterDownBuffer.push(floor.floorNum());
            });
        });
    },
        // Called every 0.1 seconds
    update: function(dt, elevators, floors) 
    {
        
    }


}
