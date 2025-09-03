"use client"
import { format } from "date-fns/format";
import { useRef } from "react";
import { DayPicker } from "react-day-picker";

export default function TournamentDayPicker({date, onChange}:{date: Date, onChange: (d:Date)=>void}) {
    const popoverRef = useRef<HTMLDivElement>(null)
    return (
        <>
            <button popoverTarget="rdp-popover" className="input input-primary" style={{ anchorName: "--rdp" } as React.CSSProperties}>
                {date ? format(date, "yyyy-MM-dd") : "Select date"}
            </button>
            <div ref={popoverRef} popover="auto" id="rdp-popover" className="dropdown" style={{ positionAnchor: "--rdp" } as React.CSSProperties}>
                <DayPicker className="react-day-picker" mode="single" selected={date} onSelect={(d) => {
                    onChange(d)
                    popoverRef?.current?.hidePopover()
                }} required={true} />
            </div>
        </>
    );
}