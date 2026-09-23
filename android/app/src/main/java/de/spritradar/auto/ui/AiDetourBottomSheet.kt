package de.spritradar.auto.ui

import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.android.material.button.MaterialButton
import de.spritradar.auto.R
import de.spritradar.auto.data.model.AiDetourAdvisor
import de.spritradar.auto.data.model.FuelType
import de.spritradar.auto.data.model.Station
import de.spritradar.auto.data.model.VerdictType
import de.spritradar.auto.databinding.BottomSheetAiDetourBinding
import java.util.Locale

class AiDetourBottomSheet : BottomSheetDialogFragment() {

    companion object {
        private const val ARG_CHEAPEST = "arg_cheapest"
        private const val ARG_NEAREST = "arg_nearest"
        private const val ARG_FUEL_TYPE = "arg_fuel_type"

        fun newInstance(
            cheapest: Station,
            nearest: Station,
            fuelType: FuelType,
            onNavigate: (Station) -> Unit
        ): AiDetourBottomSheet {
            val sheet = AiDetourBottomSheet()
            sheet.onNavigateCallback = onNavigate
            val args = Bundle().apply {
                putSerializable(ARG_CHEAPEST, cheapest)
                putSerializable(ARG_NEAREST, nearest)
                putString(ARG_FUEL_TYPE, fuelType.name)
            }
            sheet.arguments = args
            return sheet
        }
    }

    private var _binding: BottomSheetAiDetourBinding? = null
    private val binding get() = _binding!!

    private var cheapestStation: Station? = null
    private var nearestStation: Station? = null
    private var fuelType: FuelType = FuelType.E10
    private var onNavigateCallback: ((Station) -> Unit)? = null

    // State
    private var selectedLiters: Double = 55.0
    private var selectedConsumption: Double = 6.5

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            @Suppress("DEPRECATION")
            cheapestStation = it.getSerializable(ARG_CHEAPEST) as? Station
            @Suppress("DEPRECATION")
            nearestStation = it.getSerializable(ARG_NEAREST) as? Station
            val fuelName = it.getString(ARG_FUEL_TYPE, FuelType.E10.name)
            fuelType = try { FuelType.valueOf(fuelName) } catch (e: Exception) { FuelType.E10 }
            selectedConsumption = if (fuelType == FuelType.DIESEL) 5.8 else 6.5
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = BottomSheetAiDetourBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnClose.setOnClickListener { dismiss() }

        setupTankButtons()
        setupConsumptionButtons()
        setupStationCards()
        recalculateAndRender()

        binding.btnNavigateCheap.setOnClickListener {
            cheapestStation?.let { onNavigateCallback?.invoke(it) }
            dismiss()
        }
    }

    private fun setupStationCards() {
        val near = nearestStation ?: return
        val cheap = cheapestStation ?: return

        binding.tvNearName.text = near.getDisplayBrand()
        binding.tvNearDistance.text = near.formatDistance()
        binding.tvNearPrice.text = near.formatPrice(fuelType)

        binding.tvCheapName.text = cheap.getDisplayBrand()
        binding.tvCheapDistance.text = cheap.formatDistance()
        binding.tvCheapPrice.text = cheap.formatPrice(fuelType)
    }

    private fun setupTankButtons() {
        val tankButtons = listOf(
            binding.btnTank30 to 30.0,
            binding.btnTank45 to 45.0,
            binding.btnTank55 to 55.0,
            binding.btnTank70 to 70.0
        )

        for ((btn, liters) in tankButtons) {
            btn.setOnClickListener {
                selectedLiters = liters
                recalculateAndRender()
            }
        }
    }

    private fun setupConsumptionButtons() {
        val consButtons = listOf(
            binding.btnCons50 to 5.0,
            binding.btnCons65 to 6.5,
            binding.btnCons85 to 8.5
        )

        for ((btn, cons) in consButtons) {
            btn.setOnClickListener {
                selectedConsumption = cons
                recalculateAndRender()
            }
        }
    }

    private fun recalculateAndRender() {
        val cheap = cheapestStation ?: return
        val near = nearestStation ?: return

        val result = AiDetourAdvisor.calculate(
            cheapestStation = cheap,
            nearestStation = near,
            fuelType = fuelType,
            tankLiters = selectedLiters,
            consumptionPer100Km = selectedConsumption
        )

        // Update Labels
        binding.tvSelectedLiters.text = "${selectedLiters.toInt()} Liter"
        binding.tvSelectedConsumption.text = String.format(Locale.GERMANY, "%.1f L / 100 km", selectedConsumption)

        // Update Button Styles
        updateButtonSelection(
            listOf(binding.btnTank30 to 30.0, binding.btnTank45 to 45.0, binding.btnTank55 to 55.0, binding.btnTank70 to 70.0),
            selectedLiters
        )
        updateButtonSelection(
            listOf(binding.btnCons50 to 5.0, binding.btnCons65 to 6.5, binding.btnCons85 to 8.5),
            selectedConsumption
        )

        // Update Verdict Card
        binding.tvVerdictBadge.text = result.badge.uppercase()
        binding.tvVerdictTitle.text = result.title
        binding.tvVerdictDescription.text = result.description

        val colorRes = when (result.verdictType) {
            VerdictType.SUCCESS -> R.color.emerald
            VerdictType.NEUTRAL -> R.color.on_surface_muted
            VerdictType.DANGER -> R.color.rose
        }
        val tintColor = ContextCompat.getColor(requireContext(), colorRes)

        binding.cardVerdict.strokeColor = tintColor
        binding.tvVerdictBadge.setTextColor(tintColor)

        // Update Breakdown
        if (result.isSameStation) {
            binding.cardBreakdown.visibility = View.GONE
        } else {
            binding.cardBreakdown.visibility = View.VISIBLE
            binding.tvBreakdownDistance.text = "${result.formatExtraKm()} (ca. ${result.extraTimeMinutes} Min)"
            binding.tvBreakdownGross.text = result.formatGrossSavings()
            binding.tvBreakdownDetour.text = result.formatDetourCost()
            binding.tvBreakdownNet.text = result.formatNetSavings()
            binding.tvBreakdownNet.setTextColor(tintColor)
        }
    }

    private fun updateButtonSelection(buttons: List<Pair<MaterialButton, Double>>, selectedValue: Double) {
        val context = context ?: return
        val activeBg = ContextCompat.getColor(context, R.color.primary)
        val activeText = ContextCompat.getColor(context, R.color.background)
        val inactiveText = ContextCompat.getColor(context, R.color.on_surface_muted)
        val strokeColor = ContextCompat.getColor(context, R.color.surface_border)

        for ((btn, value) in buttons) {
            if (value == selectedValue) {
                btn.backgroundTintList = ColorStateList.valueOf(activeBg)
                btn.setTextColor(activeText)
                btn.strokeColor = ColorStateList.valueOf(Color.TRANSPARENT)
                btn.strokeWidth = 0
            } else {
                btn.backgroundTintList = ColorStateList.valueOf(Color.TRANSPARENT)
                btn.setTextColor(inactiveText)
                btn.strokeColor = ColorStateList.valueOf(strokeColor)
                btn.strokeWidth = (1 * resources.displayMetrics.density).toInt()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
