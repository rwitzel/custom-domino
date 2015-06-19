The exported Google Tag Manager container named 'DesignDomino'.

Contents:

* Universal Analytics Tags
  * UA-pageView
    * firingTrigger: "2147479553"
  * UA-setNumTiles
    * label: dlv-numTiles
	* firingTrigger: "4"
  * UA-changeImage
    * label: dlv-tileIndex
	* firingTrigger: "2"
  * UA-editImage
    * label: dlv-tileIndex
	* firingTrigger: "3"
  * UA-print
    * label: dlv-width
    * dimension1 : dlv-withFrame
	* metric1: dlv-numTiles
	* firingTrigger: "5"
* Triggers
  * custEv-setNumTiles (4): event = setNumTiles
  * custEv-changeImage (2): event = changeImage
  * custEv-editImage (3): event = editImage
  * custEv-print (5): event = print
* Variables
  * dlv-numTiles: numTiles (integer)
  * dlv-tileIndex: tileIndex (integer)
  * dlv-width: width (integer)
  * dlv-withFrame: withFrame (integer) (is there way to set the type to boolean using the UI?)
                    