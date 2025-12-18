import { VoicePart, SongInfo } from './types';

export const FEEDS: Record<VoicePart, string> = {
  SOPRANO: "https://www.azdickenscarolers.com/dci/soprano/feed.xml",
  ALTO: "https://www.azdickenscarolers.com/dci/alto/feed.xml",
  TENOR: "https://www.azdickenscarolers.com/dci/tenor/feed.xml",
  BASS: "https://www.azdickenscarolers.com/dci/bass/feed.xml",
};

export const CHOREO_FEED = "https://www.azdickenscarolers.com/dci/choreography/feed.xml";

export const FEED_KEY = "dc_voice_choice";
export const COUNT_KEY = "dc_play_counts";
export const DUR_KEY = "dc_durations";
export const CONFIDENCE_KEY = "dc_confidence_levels";
export const FAVORITES_KEY = "dc_favorites";
export const BOOKMARKS_KEY = "dc_bookmarks";

export const PLAYBACK_SPEEDS = [1.0, 0.75, 0.5];

export const SONG_LIST_RAW: SongInfo[] = [
    { name: "An Old-Fashioned Christmas", key: "C", page: "1" },
    { name: "Angels We Have Heard on High", key: "B", page: "5" },
    { name: "Away in a Manger", key: "D", page: "6" },
    { name: "Carol of the Bells", key: "Bb", page: "11" },
    { name: "Carol of the Hand Bells", key: "Bb", page: "14" },
    { name: "Caroling, Caroling", key: "F", page: "19" },
    { name: "Christmas in Killarney", key: "G", page: "20" },
    { name: "Deck the Hall", key: "C", page: "25" },
    { name: "Do You Hear What I Hear?", key: "Bb", page: "127" },
    { name: "Feast of Lights", key: "D", page: "26" },
    { name: "Feliz Navidad", key: "B", page: "29" },
    { name: "The First Noel", key: "F#", page: "32" },
    { name: "Fum, Fum, Fum!", key: "C", page: "37" },
    { name: "God Bless All", key: "G", page: "39" },
    { name: "God Rest Ye Merry, Gentlemen", key: "E", page: "40" },
    { name: "Good Christian Men, Rejoice", key: "C", page: "132" },
    { name: "Good King Wenceslas", key: "A", page: "40" },
    { name: "Grandma Got Run Over By a Reindeer", key: "F", page: "42" },
    { name: "Happy Holiday / White Christmas", key: "F", page: "42" },
    { name: "Hark! The Herald Angels Sing", key: "A", page: "46" },
    { name: "Have a Jolly, Jolly, Jolly Christmas", key: "D", page: "50" },
    { name: "Here Comes Santa Claus", key: "F", page: "133" },
    { name: "Here We Come A-Caroling", key: "C", page: "55" },
    { name: "A Holly, Jolly Christmas", key: "Eb", page: "57" },
    { name: "The Holly and the Ivy", key: "E", page: "134" },
    { name: "I Heard the Bells on Christmas Day", key: "Eb", page: "137" },
    { name: "I Saw Three Ships", key: "D", page: "139" },
    { name: "It Came Upon the Midnight Clear", key: "F", page: "62" },
    { name: "It’s Beginning to Look Like Christmas", key: "B", page: "63" },
    { name: "Jingle Bells", key: "D", page: "72" },
    { name: "Jingle Bell Rock", key: "Bb", page: "67" },
    { name: "Jolly Old St. Nicholas", key: "D", page: "73" },
    { name: "Joy to the World", key: "D", page: "73" },
    { name: "Let It Snow!", key: "C", page: "74" },
    { name: "Lo, How a Rose E’er Blooming", key: "D", page: "140" },
    { name: "Lullay, Thou Little Tiny Child", key: "G", page: "141" },
    { name: "Mele Kalikimaka", key: "D", page: "81" },
    { name: "O Christmas Tree", key: "D", page: "151" },
    { name: "O Come, All Ye Faithful", key: "A", page: "83" },
    { name: "O Holy Night", key: "E", page: "84" },
    { name: "O Little Town of Bethlehem", key: "A", page: "86" },
    { name: "Rudolph the Red-Nosed Reindeer", key: "A", page: "87" },
    { name: "Santa Baby", key: "Bb", page: "89" },
    { name: "Santa Claus Is Comin’ to Town", key: "F", page: "93" },
    { name: "Silent Night", key: "G", page: "96" },
    { name: "Silver Bells", key: "C", page: "97" },
    { name: "Somewhere In My Memory", key: "D", page: "100" },
    { name: "Still, Still, Still", key: "G#", page: "160" },
    { name: "Up on the Housetop", key: "Bb", page: "110" },
    { name: "We Need a Little Christmas", key: "B", page: "149" },
    { name: "We Three Kings", key: "B", page: "111" },
    { name: "What Child Is This?", key: "E", page: "112" },
    { name: "Winter Wonderland", key: "Ab", page: "115" },
    { name: "We Wish You a Merry Christmas", key: "D", page: "118" },
    { name: "Baby, What You Gonna Be", key: "Eb", page: "7" },
    { name: "Christmas Auld Lang Syne", key: "D", page: "119" },
    { name: "Christmas Is", key: "D/Bb", page: "120" },
    { name: "The Christmas Song", key: "F", page: "22" },
    { name: "Frosty the Snowman", key: "G", page: "33" },
    { name: "Have Yourself a Merry Little Christmas", key: "G", page: "51" },
    { name: "Home for the Holidays", key: "E", page: "135" },
    { name: "I’ll Be Home for Christmas", key: "A", page: "59" },
    { name: "Little Drummer Boy", key: "Eb", page: "82" },
    { name: "Mr. Santa", key: "Bb", page: "146" },
    { name: "Sleigh Ride", key: "D", page: "156" },
    { name: "Twelve Days After Christmas", key: "A", page: "104" },
    { name: "White Christmas", key: "G", page: "113" },
    { name: "You’re a Mean One, Mr. Grinch", key: "—", page: "—" },
];


export const CONFIDENCE_LEVELS = [
    { threshold: 0, title: "Frosty the Off-Key Snowman", desc: "No clue what key you’re in. Might be humming “Jingle Bells” during “Silent Night.”" },
    { threshold: 10, title: "Lip-Syncing Elf", desc: "You know the words... if someone else starts singing first." },
    { threshold: 25, title: "Book-Hugging Caroler", desc: "You’re singing, but that rehearsal book is glued to your hands." },
    { threshold: 40, title: "With Podcast Sleigh Ride", desc: "You sound great — as long as the rehearsal recording is playing in your ear." },
    { threshold: 55, title: "No Podcast, Minor Panic", desc: "Trying it a cappella. You’re one verse away from rejoining the podcast." },
    { threshold: 70, title: "Book in Pocket, Mostly Guessing", desc: "You’ve memorized 80% of the lyrics and confidently fake the rest." },
    { threshold: 85, title: "Quartet Sleigh Power", desc: "With three friends harmonizing, you could melt Frosty himself." },
    { threshold: 100, title: "Off-Book, On a Street Corner, Child Kicking Your Shins", desc: "You’re unstoppable. You are Christmas spirit incarnate." },
];

export const LOADING_PUNS = [
    "Wrapping up the playlist...",
    "Making a list, and checking it twice...",
    "Don't get your tinsel in a tangle...",
    "Decking the halls with data...",
    "Hold on for deer life...",
    "Yule be singing in no time...",
    "Tuning the sleigh bells...",
    "Fetching the figgy pudding...",
    "Sleighing the data request...",
    "Just a silent night while this loads...",
    "The elf-service is a little slow today...",
];
