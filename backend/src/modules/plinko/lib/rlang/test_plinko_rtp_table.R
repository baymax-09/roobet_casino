install.packages("dplyr")
install.packages("ggpubr")

library("dplyr")
library("ggpubr")

plinko_history <- read.csv(file.choose())

#filter data by $created_at column (data before Nov 28 2022 is affected by the rowNumber exploit)
#time format is 2022-11-28 00:00:00.000 UTC
plinko_filtered_by_date <- plinko_history[plinko_history$created_at > "2022-11-28 00:00:00.000 UTC",]


#create one tables when $risk column is 0 1 2 and another when $risk column is 3
plinko_filtered_standard <- plinko_filtered_by_date[plinko_filtered_by_date$risk < 3,]
plinko_filtered_lightning <- plinko_filtered_by_date[plinko_filtered_by_date$risk == 3,]


#calculate average of $payout_multiplier column grouped by $rows column
plinko_averages_standard <- plinko_filtered_standard %>% group_by(rows) %>% summarise(avg_payout = mean(payout_multiplier))
plinko_averages_lightning <- plinko_filtered_lightning %>% group_by(rows) %>% summarise(avg_payout = mean(payout_multiplier))

#add count of filtered data grouped by $rows column
plinko_averages_standard$count <- table(plinko_filtered_standard$rows)
plinko_averages_lightning$count <- table(plinko_filtered_lightning$rows)


# save these two tables as a pdf
install.packages("gridExtra")   # Install & load gridExtra
install.packages("gtable")

library("gridExtra")
library("gtable")
library("grid")


pdf("plinko_averages.pdf")
grid.table(plinko_averages_standard, theme = ttheme_default(base_size = 8))
grid.newpage()
grid.table(plinko_averages_lightning, theme = ttheme_default(base_size = 8))
dev.off()

