import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Waypoint } from 'react-waypoint'
import { getReleasesSortedEntries } from 'selectors'
import Centered from './Centered'
import ReleaseDay from './ReleaseDay'

const DAYS_INCREMENT = 15

/**
 * Lazily render all releases sorted by date
 */
function Releases() {
  const releases = useSelector(getReleasesSortedEntries)
  const [daysLimit, setDaysLimit] = useState(DAYS_INCREMENT)

  if (!releases.length) {
    return <Centered>No albums to display</Centered>
  }

  return (
    <>
      {releases.slice(0, daysLimit).map(([date, albums]) => (
        <ReleaseDay date={date} albums={albums} key={date} />
      ))}
      {daysLimit < releases.length && (
        <Waypoint
          bottomOffset="-100%"
          onEnter={() => setDaysLimit((limit) => limit + DAYS_INCREMENT)}
          key={daysLimit}
        />
      )}
    </>
  )
}

export default Releases
