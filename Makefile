# Makefile — one-command reproduction for the Insomnia TCM Mining pipeline.
#
# Usage:
#   make all           # run the full pipeline end-to-end
#   make clean         # remove generated outputs
#   make bootstrap1000 # re-run step10 with B = 1000 (manuscript setting)

PY ?= python3
S = scripts

.PHONY: all clean bootstrap1000 step1 step2 step3 step4 step5 step6 step7 step8 step9 step10 step11

all: step1 step2 step3 step4 step5 step6 step7 step8 step9 step10 step11
	@echo ""
	@echo "==============================================================="
	@echo "  Pipeline finished. See outputs/reproducibility_report.html"
	@echo "==============================================================="

step1:
	$(PY) $(S)/step1_data_audit.py

step2: step1
	$(PY) $(S)/step2_normalization.py

step3: step2
	$(PY) $(S)/step3_frequency_analysis.py

step4: step2
	$(PY) $(S)/step4_transaction_matrix.py

step5: step4
	$(PY) $(S)/step5_apriori_analysis.py

step6: step3
	$(PY) $(S)/step6_network_construction.py

step7: step6
	$(PY) $(S)/step7_centrality_analysis.py

step8: step6
	$(PY) $(S)/step8_community_detection.py

step9: step6
	$(PY) $(S)/step9_lift_heatmap.py

step10: step4
	$(PY) $(S)/step10_sensitivity_analysis.py --bootstrap 200

step11: step2 step3 step4 step5 step6 step7 step8 step9 step10
	$(PY) $(S)/step11_reproducibility_report.py

bootstrap1000:
	$(PY) $(S)/step10_sensitivity_analysis.py --bootstrap 1000

clean:
	rm -rf outputs/intermediates/* outputs/tables/* outputs/figures/* outputs/reproducibility_report.html
