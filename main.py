import tkinter as tk
from tkinter import ttk
from collections import deque
import math
import random

class ScoreBoard:
    def __init__(self, players, cards_per_round, trump_suites):
        self.root = tk.Tk()
        self.root.title("Judgement Score Tracker")
        self.players = players
        self.scores = {player: [] for player in players}
        self.predictions = {player: [] for player in players}
        self.tricks = {player: [] for player in players}
        self.cards_per_round = cards_per_round
        self.trump_suites = trump_suites
        
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("Treeview", background="#D3D3D3", foreground="black", rowheight=30, fieldbackground="#D3D3D3")
        style.configure("Treeview.Heading", font=('Calibri', 14, 'bold'))
        
        self.tree = ttk.Treeview(self.root, show='headings', style="Treeview")
        self.tree['columns'] = ('Round', 'Cards', 'Trump') + tuple(f"{player}_{col}" for player in players for col in ['Pred', 'Tricks', 'Score'])
        
        self.tree.heading('Round', text='Round')
        self.tree.column('Round', width=60, anchor='center')
        self.tree.heading('Cards', text='Cards')
        self.tree.column('Cards', width=60, anchor='center')
        self.tree.heading('Trump', text='Trump')
        self.tree.column('Trump', width=80, anchor='center')
        
        for player in players:
            self.tree.heading(f"{player}_Pred", text=f"{player}\nPred")
            self.tree.heading(f"{player}_Tricks", text="Tricks")
            self.tree.heading(f"{player}_Score", text="Score")
            self.tree.column(f"{player}_Pred", width=70, anchor='center')
            self.tree.column(f"{player}_Tricks", width=70, anchor='center')
            self.tree.column(f"{player}_Score", width=70, anchor='center')
        
        self.tree.pack(padx=10, pady=10, fill='both', expand=True)
        
        self.prepopulate_table()
        
        self.total_row = self.tree.insert('', 'end', values=('Total', '', '') + ('',) * (len(players) * 3), tags=('total',))
        self.tree.tag_configure('total', background='lightblue', font=('Calibri', 12, 'bold'))
        
    def prepopulate_table(self):
        for round_num, cards in enumerate(self.cards_per_round, 1):
            trump = self.trump_suites[(round_num - 1) % len(self.trump_suites)]
            values = [round_num, cards, trump] + [''] * (len(self.players) * 3)
            self.tree.insert('', 'end', values=values)
        
    def update(self):
        for i, item in enumerate(self.tree.get_children()[:-1]):  # Exclude total row
            values = list(self.tree.item(item)['values'])
            for j, player in enumerate(self.players):
                pred_index = 3 + j * 3
                tricks_index = 4 + j * 3
                score_index = 5 + j * 3
                
                values[pred_index] = self.predictions[player][i] if i < len(self.predictions[player]) else ''
                values[tricks_index] = self.tricks[player][i] if i < len(self.tricks[player]) else ''
                values[score_index] = self.scores[player][i] if i < len(self.scores[player]) else ''
            
            self.tree.item(item, values=values)
        
        total_values = ['Total', '', '']
        for player in self.players:
            total_values.extend(['', '', sum(self.scores[player])])
        self.tree.item(self.total_row, values=total_values)
        
        self.root.update()

    def highlight_cell(self, round_num, player, column):
        item = list(self.tree.get_children())[round_num - 1]
        
        # Clear previous highlights
        for col in range(len(self.players) * 3 + 3):  # Total columns including Round and Cards
            if col == list(self.tree['columns']).index(f"{player}_{column}"):
                continue
            # Resetting to default color (if needed)
            self.tree.item(item, tags=())
            
        # Highlight current cell
        column_index = list(self.tree['columns']).index(f"{player}_{column}")
        
        # Set tag to highlight this specific cell
        current_value = list(self.tree.item(item)['values'])[column_index]
        
        # Use a temporary tag to highlight the specific cell
        temp_tag_name = f"highlight_{round_num}_{player}_{column}"
        
        # Create a new tag with red background color
        self.tree.tag_configure(temp_tag_name, background='red')
        
        # Apply the tag to the specific cell
        self.tree.item(item, tags=(temp_tag_name,))
        
    def remove_highlight(self):
        # Remove all highlight tags from all items
        for item in self.tree.get_children():
            tags = list(self.tree.item(item)['tags'])
            for tag in tags:
                if tag.startswith('highlight_'):
                    # Resetting to default color (if needed)
                    new_tags = [t for t in tags if t != tag]
                    self.tree.item(item, tags=new_tags)

def get_player_names():
    players = []
    while True:
        name = input("Enter player name (or press Enter to finish): ")
        if name == "":
            if len(players) < 2:
                print("Please enter at least 2 players.")
            else:
                break
        else:
            players.append(name)
    return players

def generate_trump_suite_order():
    red_suites = ['♥', '♦']
    black_suites = ['♠', '♣']
    random.shuffle(red_suites)
    random.shuffle(black_suites)
    trump_order = []
    for i in range(2):
        trump_order.append(red_suites[i])
        trump_order.append(black_suites[i])
    trump_order.append('No Trump')
    return trump_order

def calculate_cards_per_round(num_players):
    max_cards = math.floor(52 / num_players)
    cards_per_round = []
    
    # Decreasing
    for i in range(max_cards, 0, -1):
        cards_per_round.append(i)
    
    # Increasing (excluding max_cards as it's already included)
    for i in range(2, max_cards):
        cards_per_round.append(i)
    
    return cards_per_round

def play_game(players, scoreboard):
    player_order = deque(players)

    for round_num, cards_dealt in enumerate(scoreboard.cards_per_round, 1):
        trump_suite = scoreboard.trump_suites[(round_num - 1) % len(scoreboard.trump_suites)]
        print(f"\nRound {round_num}")
        print(f"Cards dealt this round: {cards_dealt}")
        print(f"Trump suite: {trump_suite}")

        predictions = {}
        total_prediction = 0
        
        # Loop through players for predictions
        for i, player in enumerate(player_order):
            scoreboard.highlight_cell(round_num, player, 'Pred')  # Highlight prediction cell
            
            while True:
                try:
                    if i == len(player_order) - 1:
                        invalid_prediction = cards_dealt - total_prediction
                        pred = int(input(f"{player}, enter your prediction (0-{cards_dealt}, except {invalid_prediction}): "))
                        if 0 <= pred <= cards_dealt and pred != invalid_prediction:
                            predictions[player] = pred
                            break
                        else:
                            print(f"Please enter a valid number (0-{cards_dealt}, except {invalid_prediction}).")
                    else:
                        pred = int(input(f"{player}, enter your prediction (0-{cards_dealt}): "))
                        if 0 <= pred <= cards_dealt:
                            predictions[player] = pred
                            total_prediction += pred
                            break
                        else:
                            print(f"Please enter a number between 0 and {cards_dealt}.")
                except ValueError:
                    print("Please enter a valid number.")
            
            scoreboard.predictions[player].append(pred)
            scoreboard.update()
        
            scoreboard.remove_highlight()  # Remove highlight after input

        actual_tricks = {}
        
        # Loop through players for actual tricks won
        for player in player_order:
            scoreboard.highlight_cell(round_num, player, 'Tricks')  # Highlight tricks cell
        
            while True:
                try:
                    tricks = int(input(f"{player}, enter actual tricks won (0-{cards_dealt}): "))
                    if 0 <= tricks <= cards_dealt:
                        actual_tricks[player] = tricks
                        break
                    else:
                        print(f"Please enter a number between 0 and {cards_dealt}.")
                except ValueError:
                    print("Please enter a valid number.")
            
            scoreboard.tricks[player].append(tricks)
            scoreboard.update()
            
            scoreboard.remove_highlight()  # Remove highlight after input

        for player in players:
            if predictions[player] == actual_tricks[player]:
                round_score = 10 + actual_tricks[player]
            else:
                round_score = -abs(10 + predictions[player])
        
            scoreboard.scores[player].append(round_score)
            print(f"{player} scored {round_score} this round.")

        print("\nCurrent Scores:")
        for player in players:
            print(f"{player}: {sum(scoreboard.scores[player])}")

        scoreboard.update()

        # Rotate player order for next round
        player_order.rotate(-1)

    return scoreboard.scores
    
def main():
    print("Welcome to Judgement Score Tracker!")
    players = get_player_names()
    cards_per_round = calculate_cards_per_round(len(players))
    trump_suites = generate_trump_suite_order()
    scoreboard = ScoreBoard(players, cards_per_round, trump_suites)
    final_scores = play_game(players, scoreboard)

    print("\nFinal Scores:")
    for player in players:
        print(f"{player}: {sum(final_scores[player])}")

    winner = max(final_scores, key=lambda x: sum(final_scores[x]))
    print(f"\nThe winner is {winner} with {sum(final_scores[winner])} points!")

    scoreboard.root.mainloop()

if __name__ == "__main__":
    main()