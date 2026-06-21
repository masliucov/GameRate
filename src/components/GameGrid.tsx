import GameCard from "./GameCard";
import { Stagger, StaggerItem } from "./motion/Stagger";
import { Game } from "@/lib/rawg";

interface Props {
  games: Game[];
  cols?: 2 | 3 | 4 | 5;
}

export default function GameGrid({ games, cols = 4 }: Props) {
  const colClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  }[cols];

  return (
    <Stagger className={`grid ${colClass} gap-4`}>
      {games.map((game) => (
        <StaggerItem key={game.id}>
          <GameCard game={game} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
