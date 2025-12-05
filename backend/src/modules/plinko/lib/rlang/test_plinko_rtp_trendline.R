#Uncomment these when running the first time, I just commented them to stop getting warnings in the IDE when re-running
#install.packages("dplyr")
#install.packages("ggpubr")
#install.packages("ggplot2")

library("dplyr")
library("ggpubr")
library("ggplot2")

plinko_history_full <- read.csv(file.choose())

# Drop unneeded columns before duplication to save memory
plinko_history <- plinko_history_full[,c("user_id", "rows", "bet_amount", "payout_multiplier", "risk", "created_at", "rows")]

#filter out users with 0 $bet_amount -- This is already checked on the backend but just in case
plinko_filtered_by_bet <- plinko_history[plinko_history$bet_amount > 0,]

#filter data by $created_at column (data before Nov 28 2022 is affected by the rowNumber exploit)
#time format is 2022-11-28 00:00:00.000 UTC
plinko_filtered_by_date <- plinko_filtered_by_bet[plinko_filtered_by_bet$created_at > "2022-11-28 00:00:00.000 UTC",]

#create one tables when $risk column is 0 1 2 and another when $risk column is 3
plinko_standard <- plinko_filtered_by_date[plinko_filtered_by_date$risk < 3,]
plinko_lightning <- plinko_filtered_by_date[plinko_filtered_by_date$risk == 3,]

#separate data into 8 tables based on $rows column from 8 to 16
plinko_standard_8 <- plinko_standard[plinko_standard$rows == 8,]
plinko_standard_9 <- plinko_standard[plinko_standard$rows == 9,]
plinko_standard_10 <- plinko_standard[plinko_standard$rows == 10,]
plinko_standard_11 <- plinko_standard[plinko_standard$rows == 11,]
plinko_standard_12 <- plinko_standard[plinko_standard$rows == 12,]
plinko_standard_13 <- plinko_standard[plinko_standard$rows == 13,]
plinko_standard_14 <- plinko_standard[plinko_standard$rows == 14,]
plinko_standard_15 <- plinko_standard[plinko_standard$rows == 15,]
plinko_standard_16 <- plinko_standard[plinko_standard$rows == 16,]

plinko_standard_current = plinko_standard_8

#create ordered ids column with numbers sorted by $created_at column
plinko_standard_current$ordered_id <- order(plinko_standard_current$created_at, decreasing = TRUE)   
# plinko_standard_current$ordered_id <- rev(plinko_standard_current$ordered_id)

#change table index to ordered ids
# plinko_standard_current <- plinko_standard_current[order(plinko_standard_current$ordered_id),]

#create cumulative product average of $payout_multiplier column OVER TIME in reverse order
plinko_standard_current$sum_payout_multiplier <- cumsum(rev(plinko_standard_current$payout_multiplier))

#create average of $sum_payout column grouped by $ordered_id column
plinko_standard_current$avg_payout_multiplier <- plinko_standard_current$sum_payout_multiplier / plinko_standard_current$ordered_id

#multiply $rtp column by 100
plinko_standard_current$rtp <- plinko_standard_current$avg_payout_multiplier * 100

#plot average of $rtp column over $ordered_id column
plot = ggplot(plinko_standard_current, aes(x = ordered_id, y = rtp)) + geom_line() + labs(title = "RTP over time", x = "Game number", y = "RTP")

#set y limits because RTP starts volatile before stabilizing
plot = plot + ylim(60, 100)

#save plot as a pdf
ggsave("rtp_trendline.pdf", plot = plot)



